
  function addtocart(proId) {
    $.ajax({
      url: `/go-to-cart?id=${proId}`,
      method: 'GET',
      success: (response) => {
        if (response.status) {
            const cartCountElement = document.querySelector('.navbar-nav .nav-item .badge');
        let currentCount = parseInt(cartCountElement.textContent, 10);
        cartCountElement.textContent = currentCount + 1;

          alert('Item added to cart successfully!');
        } else {
          alert('Failed to add item to cart: ' + response.message);
        }
      },
      error: (jqXHR, textStatus, errorThrown) => {
        console.error('Error:', textStatus, errorThrown);
        alert('An error occurred while adding the item to the cart.');
      }
    });
  }


