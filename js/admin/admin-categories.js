/**
 * Admin Categories Module
 * Handles category management and CRUD operations with real-time data
 */

let categoriesList = [];

// ============================================
// LOAD CATEGORIES FROM DATABASE
// ============================================

async function loadCategories() {
    try {
        showSpinner(true);

        // Fetch from backend API
        const data = await apiRequest('/categories');

        if (data.success && data.categories) {
            categoriesList = data.categories.map(category => ({
                id: category.id,
                name: category.name,
                icon: category.icon || 'fa-box',
                color: category.color || '#2575fc',
                productCount: category.product_count || 0,
                slug: category.slug,
                description: category.description
            }));

            renderCategoriesGrid();
            showToast('success', `Loaded ${categoriesList.length} categories`);
        } else {
            categoriesList = [];
            renderCategoriesGrid();
        }

        showSpinner(false);
    } catch (error) {
        console.error('Error loading categories:', error);
        showAPIError(error);
        categoriesList = [];
        renderCategoriesGrid();
        showSpinner(false);
    }
}

// ============================================
// RENDER CATEGORIES GRID
// ============================================

function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    if (categoriesList.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-folder fa-3x text-muted mb-3"></i>
                <p class="text-muted">No categories found</p>
                <button class="btn btn-primary" onclick="showAddCategoryModal()">
                    <i class="fas fa-plus me-2"></i>Add Category
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = categoriesList.map(category => `
        <div class="col-md-4 col-lg-3">
            <div class="category-card-admin">
                <div class="category-icon-admin" style="background: ${category.color}">
                    <i class="fas ${category.icon}"></i>
                </div>
                <h5 class="mt-3 mb-2">${category.name}</h5>
                <p class="text-muted mb-3">${category.productCount} Products</p>
                <div class="d-flex justify-content-center gap-2">
                    <button class="action-btn edit" onclick="editCategory('${category.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteCategory('${category.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// ADD CATEGORY
// ============================================

function showAddCategoryModal() {
    Swal.fire({
        title: 'Add New Category',
        html: `
            <form id="addCategoryForm" class="text-start">
                <div class="mb-3">
                    <label class="form-label">Category Name</label>
                    <input type="text" class="form-control" id="categoryName" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Icon Class (FontAwesome)</label>
                    <input type="text" class="form-control" id="categoryIcon" placeholder="fa-box" value="fa-box" required>
                    <small class="text-muted">Example: fa-laptop, fa-headphones, fa-mobile</small>
                </div>
                <div class="mb-3">
                    <label class="form-label">Color</label>
                    <input type="color" class="form-control" id="categoryColor" value="#2575fc">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description (optional)</label>
                    <textarea class="form-control" id="categoryDescription" rows="2"></textarea>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Category',
        confirmButtonColor: '#2575fc',
        preConfirm: async () => {
            const name = document.getElementById('categoryName').value;
            const icon = document.getElementById('categoryIcon').value;
            const color = document.getElementById('categoryColor').value;
            const description = document.getElementById('categoryDescription').value;

            if (!name || !icon) {
                Swal.showValidationMessage('Please fill all required fields');
                return false;
            }

            const categoryData = {
                name: name,
                slug: name.toLowerCase().replace(/\s+/g, '-'),
                icon: icon,
                color: color,
                description: description
            };

            try {
                const response = await apiRequest('/categories', {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });

                if (response.success) {
                    await loadCategories();
                    showToast('success', 'Category added successfully!');
                }
            } catch (error) {
                Swal.showValidationMessage(`Error: ${error.message}`);
                return false;
            }
        }
    });
}

// ============================================
// EDIT CATEGORY
// ============================================

function editCategory(categoryId) {
    const category = categoriesList.find(c => c.id === categoryId);
    if (!category) return;

    Swal.fire({
        title: 'Edit Category',
        html: `
            <form id="editCategoryForm" class="text-start">
                <div class="mb-3">
                    <label class="form-label">Category Name</label>
                    <input type="text" class="form-control" id="editCategoryName" value="${category.name}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Icon Class</label>
                    <input type="text" class="form-control" id="editCategoryIcon" value="${category.icon}" required>
                    <small class="text-muted">Example: fa-laptop, fa-headphones, fa-mobile</small>
                </div>
                <div class="mb-3">
                    <label class="form-label">Color</label>
                    <input type="color" class="form-control" id="editCategoryColor" value="${category.color}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="editCategoryDescription" rows="2">${category.description || ''}</textarea>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        confirmButtonColor: '#2575fc',
        preConfirm: async () => {
            const updatedData = {
                name: document.getElementById('editCategoryName').value,
                slug: document.getElementById('editCategoryName').value.toLowerCase().replace(/\s+/g, '-'),
                icon: document.getElementById('editCategoryIcon').value,
                color: document.getElementById('editCategoryColor').value,
                description: document.getElementById('editCategoryDescription').value
            };

            try {
                const response = await apiRequest(`/categories/${categoryId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedData)
                });

                if (response.success) {
                    await loadCategories();
                    showToast('success', 'Category updated successfully!');
                }
            } catch (error) {
                Swal.showValidationMessage(`Error: ${error.message}`);
                return false;
            }
        }
    });
}

// ============================================
// DELETE CATEGORY
// ============================================

function deleteCategory(categoryId) {
    const category = categoriesList.find(c => c.id === categoryId);
    if (!category) return;

    Swal.fire({
        title: 'Delete Category',
        html: `
            <p>Are you sure you want to delete <strong>${category.name}</strong>?</p>
            <p class="text-muted small">This category has ${category.productCount} products.</p>
            ${category.productCount > 0 ? '<p class="text-warning small"><i class="fas fa-exclamation-triangle"></i> Products in this category will be unassigned.</p>' : ''}
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        confirmButtonColor: '#dc3545'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await apiRequest(`/categories/${categoryId}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    await loadCategories();
                    showToast('success', 'Category deleted successfully!');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                showAPIError(error);
            }
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showSpinner(show) {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}
