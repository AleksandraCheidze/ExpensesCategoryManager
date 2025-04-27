// Direct navigation handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up direct navigation handlers');
    
    // Get navigation links
    const navExpenses = document.getElementById('nav-expenses');
    const navReports = document.getElementById('nav-reports');
    const navCategories = document.getElementById('nav-categories');
    
    // Get sections
    const expensesSection = document.getElementById('expenses-section');
    const reportsSection = document.getElementById('reports-section');
    const categoriesSection = document.getElementById('categories-section');
    
    console.log('Navigation elements:', {
        navExpenses, navReports, navCategories,
        expensesSection, reportsSection, categoriesSection
    });
    
    // Add click handlers
    if (navExpenses) {
        navExpenses.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Expenses link clicked');
            
            // Update active link
            navExpenses.classList.add('active');
            navReports.classList.remove('active');
            navCategories.classList.remove('active');
            
            // Show expenses section, hide others
            expensesSection.classList.add('active-section');
            reportsSection.classList.remove('active-section');
            categoriesSection.classList.remove('active-section');
        });
    }
    
    if (navReports) {
        navReports.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Reports link clicked');
            
            // Update active link
            navExpenses.classList.remove('active');
            navReports.classList.add('active');
            navCategories.classList.remove('active');
            
            // Show reports section, hide others
            expensesSection.classList.remove('active-section');
            reportsSection.classList.add('active-section');
            categoriesSection.classList.remove('active-section');
        });
    }
    
    if (navCategories) {
        navCategories.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Categories link clicked');
            
            // Update active link
            navExpenses.classList.remove('active');
            navReports.classList.remove('active');
            navCategories.classList.add('active');
            
            // Show categories section, hide others
            expensesSection.classList.remove('active-section');
            reportsSection.classList.remove('active-section');
            categoriesSection.classList.add('active-section');
        });
    }
});
