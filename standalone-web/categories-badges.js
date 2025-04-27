// Categories management with badges
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up categories management with badges');
    
    // Get DOM elements
    const categoriesList = document.getElementById('categories-list');
    const newCategoryInput = document.getElementById('new-category');
    const addCategoryBtn = document.getElementById('add-category');
    
    // Load categories from localStorage
    let categories = [];
    try {
        const storedCategories = localStorage.getItem('categories');
        if (storedCategories) {
            categories = JSON.parse(storedCategories);
            console.log('Loaded categories from localStorage:', categories);
        } else {
            // Default categories
            categories = ['Food', 'Clothing', 'Transport', 'Rent', 'Other', 'Cosmetic'];
            localStorage.setItem('categories', JSON.stringify(categories));
            console.log('No categories in localStorage, using defaults');
        }
    } catch (error) {
        console.error('Error loading categories from localStorage:', error);
        categories = ['Food', 'Clothing', 'Transport', 'Rent', 'Other', 'Cosmetic'];
    }
    
    // Update categories list
    function updateCategoriesList() {
        if (!categoriesList) {
            console.error('Categories list element not found!');
            return;
        }
        
        console.log('Updating categories list with badges');
        
        // Clear existing categories
        categoriesList.innerHTML = '';
        
        // Add each category to the list
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'category-item';
            li.innerHTML = `
                <span class="category-badge">${category}</span>
                <button class="delete-category-btn" data-category="${category}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            categoriesList.appendChild(li);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-category-btn').forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                console.log('Deleting category:', category);
                
                // Remove category from array
                const index = categories.indexOf(category);
                if (index !== -1) {
                    categories.splice(index, 1);
                    
                    // Save to localStorage
                    localStorage.setItem('categories', JSON.stringify(categories));
                    
                    // Update UI
                    updateCategoriesList();
                    updateCategorySelects();
                }
            });
        });
    }
    
    // Add event listener to add category button
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            if (!newCategoryInput) {
                console.error('New category input not found!');
                return;
            }
            
            const newCategory = newCategoryInput.value.trim();
            if (newCategory) {
                console.log('Adding new category:', newCategory);
                
                // Add to array if not already exists
                if (!categories.includes(newCategory)) {
                    categories.push(newCategory);
                    
                    // Save to localStorage
                    localStorage.setItem('categories', JSON.stringify(categories));
                    
                    // Update UI
                    updateCategoriesList();
                    updateCategorySelects();
                    
                    // Clear input
                    newCategoryInput.value = '';
                } else {
                    alert('This category already exists!');
                }
            }
        });
    }
    
    // Update category select elements
    function updateCategorySelects() {
        console.log('Updating category selects with categories:', categories);
        
        // Update expense category select
        const expenseCategorySelect = document.getElementById('expense-category');
        if (expenseCategorySelect) {
            // Save current selection
            const currentSelection = expenseCategorySelect.value;
            
            // Clear existing options
            expenseCategorySelect.innerHTML = '';
            
            // Add options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                expenseCategorySelect.appendChild(option);
            });
            
            // Restore selection if possible
            if (categories.includes(currentSelection)) {
                expenseCategorySelect.value = currentSelection;
            }
        }
        
        // Update report category select
        const reportCategorySelect = document.getElementById('report-category');
        if (reportCategorySelect) {
            // Save current selection
            const currentSelection = reportCategorySelect.value;
            
            // Clear existing options
            reportCategorySelect.innerHTML = '';
            
            // Add "All Categories" option
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Categories';
            reportCategorySelect.appendChild(allOption);
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                reportCategorySelect.appendChild(option);
            });
            
            // Restore selection if possible
            if (categories.includes(currentSelection) || currentSelection === 'all') {
                reportCategorySelect.value = currentSelection;
            } else {
                reportCategorySelect.value = 'all';
            }
        }
    }
    
    // Initialize
    updateCategoriesList();
    updateCategorySelects();
});
