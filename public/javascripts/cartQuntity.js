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
    const isconfirm=confirm("Are you sure you want to remove this item from the cart?");
    if (isconfirm) {
      $.ajax({
        url: '/remove-item', // The server endpoint that removes the item
        type: 'GET', 
        data: { id: cartId, product: productId }, // Pass cartId and productId
        success: function (response) {
          // Refresh the page after the item is removed
          location.reload();
        },
        error: function () {
          alert("Error removing item");
        }
      });
    }
    
  }
