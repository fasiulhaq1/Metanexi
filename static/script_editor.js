document.addEventListener("DOMContentLoaded", function() {
  var toggleBtn = document.getElementById('toggle_btn');
  var subElements = document.getElementById('sub_elements');

  // Function to toggle the visibility of sub_elements
  function toggleSubElements() {
    subElements.style.display = subElements.style.display === 'none' ? 'block' : 'none';
  }

  // Event listener for anchor click
  toggleBtn.addEventListener('click', function(e) {
    e.preventDefault(); // Prevents the default action of anchor click
    toggleSubElements();
    e.stopPropagation(); // Prevents the click event from bubbling up
  });

  // Event listener for document click to hide sub_elements
  document.addEventListener('click', function(e) {
    if (e.target.id !== 'toggle_btn') {
      subElements.style.display = 'none';
    }
  });
});