function changeNum(cartId, productId, count) {
    $.ajax({
      url: '/change-quantity',
      type: 'POST',
      data:
        $.param({
          cartId, productId, count
        }),
       contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      success: function (response) {
        $('#quantity-' + productId).text(response.count);
        location.reload();
        alert("updated")
        
      },
      error: function () {
        alert("error");
      }
    });

  }

  function removeItem(cartId, productId) {
    const isconfirm = confirm("Are you sure you want to remove this item from the cart?");
    if (isconfirm) {
        // Save the current scroll position before reload
        sessionStorage.setItem('scrollPosition', window.scrollY);

        $.ajax({
            url: '/remove-item',
            type: 'GET',
            data: { id: cartId, product: productId },
            success: function (response) {
                // Reload the page after the item is removed
                location.reload();
            },
            error: function () {
                alert("Error removing item");
            }
        });
    }
}

// Restore the scroll position after the page reloads
$(document).ready(function () {
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition !== null) {
        window.scrollTo(0, parseInt(scrollPosition));
        sessionStorage.removeItem('scrollPosition'); // Clean up after restoration
    }
});

