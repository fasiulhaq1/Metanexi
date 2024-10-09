document.addEventListener('DOMContentLoaded', function () {
    const productsContainer = document.getElementById('products-container');
    const paginationContainer = document.getElementById('pagination-container');

    const PAGE_SIZE = 10; // Number of products per page
    let currentPage = 1; // Current page number

    // Fetch products from the backend
    fetchProducts();

    function fetchProducts() {
        fetch(`/products?page=${currentPage}&pageSize=${PAGE_SIZE}`)
            .then(response => response.json())
            .then(products => {
                displayProducts(products);
                generatePaginationLinks(products.length);
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    function displayProducts(products) {
        productsContainer.innerHTML = ''; // Clear previous products
        products.forEach(product => {
            const productElement = createProductElement(product);
            productsContainer.appendChild(productElement);
        });
    }

    function createProductElement(product) {
        // Create product card HTML here (title, preview image, file type, etc.)
    }

    function generatePaginationLinks(totalProducts) {
        paginationContainer.innerHTML = ''; // Clear previous pagination links
        const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement('li');
            pageLink.classList.add('page-item');
            pageLink.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pageLink.addEventListener('click', handlePaginationClick);
            if (i === currentPage) {
                pageLink.classList.add('active');
            }
            paginationContainer.appendChild(pageLink);
        }
    }

    function handlePaginationClick(event) {
        event.preventDefault();
        currentPage = parseInt(event.target.dataset.page);
        fetchProducts();
    }
});
