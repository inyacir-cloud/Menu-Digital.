import { Category } from '../types';

interface CategoryListProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryList({ categories, activeCategory, onSelectCategory }: CategoryListProps) {
  return (
    <div className="flex overflow-x-auto py-3 sm:py-4 gap-2 sm:gap-3 no-scrollbar scroll-smooth -mx-1 px-1">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-sm transition-all shrink-0 active:scale-95 ${
            activeCategory === category.id
              ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-500 hover:text-orange-500 active:bg-orange-50'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
