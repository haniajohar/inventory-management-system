"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfitLossCard from "./ProfitLossCard";
import SalesChart from "./SalesChart";
import SalesSummary from "./SalesSummary";
import ProductTable from "./ProductTable";
import StockInputForm from "./StockInputForm";
import AnalysisResults from "./AnalysisResults";
import Suggestions from "./Suggestions";

export default function ReportsPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [stockData, setStockData] = useState({});

  // State for fetched products
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // NEW: State for fetched sales data
  const [recentSales, setRecentSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesFetchError, setSalesFetchError] = useState(null);

  // State for authentication
  const [token, setToken] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  // Effect to check authentication and fetch all necessary data
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('accessToken');
        if (!storedToken) {
          console.log('No token found, redirecting to login.');
          router.push('/auth/login');
          return;
        }
        setToken(storedToken);
        setAuthenticated(true);

        // --- Fetch Products ---
        try {
          setLoadingProducts(true);
          setFetchError(null);
          console.log('Attempting to fetch products from backend...');
          const productsResponse = await fetch('http://localhost:5000/api/products/my-products', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (!productsResponse.ok) {
            if (productsResponse.status === 401) {
              console.error('Authentication failed during product fetch. Token expired or invalid.');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user_id');
              router.push('/auth/login');
              return;
            }
            const errorData = await productsResponse.json();
            throw new Error(errorData.error || `HTTP error! status: ${productsResponse.status}`);
          }

          const productsData = await productsResponse.json();
          console.log('Products fetched successfully:', productsData);
          setAllProducts(productsData);
        } catch (error) {
          console.error('Error fetching products:', error);
          setFetchError(error.message || 'Failed to fetch products.');
        } finally {
          setLoadingProducts(false);
        }

        // --- NEW: Fetch Recent Sales ---
        try {
          setLoadingSales(true);
          setSalesFetchError(null);
          console.log('Attempting to fetch recent sales from backend...');
          const salesResponse = await fetch('http://localhost:5000/api/products/my-recent-sales', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (!salesResponse.ok) {
            if (salesResponse.status === 401) {
              console.error('Authentication failed during sales fetch. Token expired or invalid.');
              // This might happen if token expires between product and sales fetch
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user_id');
              router.push('/auth/login');
              return;
            }
            const errorData = await salesResponse.json();
            throw new Error(errorData.error || `HTTP error! status: ${salesResponse.status}`);
          }

          const salesData = await salesResponse.json();
          console.log('Recent sales fetched successfully:', salesData);
          setRecentSales(salesData);
        } catch (error) {
          console.error('Error fetching recent sales:', error);
          setSalesFetchError(error.message || 'Failed to fetch recent sales.');
        } finally {
          setLoadingSales(false);
        }
      }
    };

    checkAuthAndFetchData();
  }, [router]);


  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const isNextDisabled = () => {
    if (step === 2 && selectedProducts.length === 0) return true;
    if (step === 3) {
      // Check if all selected products have both stock and sold quantities entered
      const allStockDataEntered = selectedProducts.every(productId =>
        stockData[productId] &&
        stockData[productId].stock !== undefined &&
        stockData[productId].sold !== undefined &&
        stockData[productId].stock !== null &&
        stockData[productId].sold !== null &&
        stockData[productId].stock >= 0 && // Ensure non-negative
        stockData[productId].sold >= 0
      );
      return !allStockDataEntered;
    }
    return false;
  };

  // Display loading/error states for both product and sales data
  if (!authenticated || loadingProducts || loadingSales) {
    return (
      <div className="p-6 bg-gray-200 flex items-center justify-center min-h-screen">
        <p className="text-gray-600">
          {authenticated ? (loadingProducts || loadingSales ? "Loading data..." : "Loading...") : "Authenticating..."}
        </p>
      </div>
    );
  }

  if (fetchError || salesFetchError) {
    return (
      <div className="p-6 bg-red-100 text-red-700 border border-red-400 rounded-md m-4">
        <p>Error loading data:</p>
        {fetchError && <p>- Products: {fetchError}</p>}
        {salesFetchError && <p>- Recent Sales: {salesFetchError}</p>}
        <p>Please ensure your backend is running and you are logged in.</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-200 space-y-8">
      <h1 className="text-3xl text-purple-900 font-bold">📊 Business Insights & Reports</h1>

      <div className="text-gray-900 mb-4">
        <p>Step {step} of 5</p>
      </div>

      {step === 1 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfitLossCard /* This will need data passed to it */ />
            <SalesChart /* This will also need data passed to it */ />
          </div>
          {/* Pass recentSales and allProducts to SalesSummary */}
          <SalesSummary recentSales={recentSales} allProducts={allProducts} />
          <button
            onClick={nextStep}
            className="mt-6 px-4 py-2 bg-purple-600 cursor-pointer text-white rounded-md hover:bg-purple-700"
            disabled={isNextDisabled()}
          >
            View Product Report →
          </button>
        </>
      )}

      {step === 2 && (
        <ProductTable
          onNext={nextStep}
          onBack={prevStep}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          allProducts={allProducts} // Already correctly passed
        />
      )}

      {step === 3 && (
        <StockInputForm
          selectedProducts={selectedProducts}
          onNext={nextStep}
          onBack={prevStep}
          stockData={stockData}
          setStockData={setStockData}
          allProducts={allProducts} // Already correctly passed
        />
      )}

      {step === 4 && (
        <AnalysisResults
          stockData={stockData}
          onNext={nextStep}
          onBack={prevStep}
          selectedProducts={selectedProducts}
          allProducts={allProducts} // Already correctly passed
        />
      )}

      {step === 5 && (
        <Suggestions
          stockData={stockData}
          onBack={prevStep}
          selectedProducts={selectedProducts}
          allProducts={allProducts} // Already correctly passed
        />
      )}
    </div>
  );
}
