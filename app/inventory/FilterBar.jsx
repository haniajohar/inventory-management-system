// app/inventory/FilterBar.jsx
export default function FilterBar({ 
  searchTerm, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange, 
  categories 
}) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <input
        type="text"
        placeholder="Search products..."
        className="p-2 border rounded-md w-full sm:w-64"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select 
        className="p-2 border rounded-md"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}