$(document).ready(function() {
	var elem = document.getElementById('mySwipe');
	window.mySwipe = Swipe(elem, {
	  // startSlide: 4,
	  // auto: 3000,
	  // continuous: true,
	  // disableScroll: true,
	  // stopPropagation: true,
	  // callback: function(index, element) {},
	  // transitionEnd: function(index, element) {}
	});

	$('#next').click(function(e) {
		mySwipe.next();
	});

	$('#prev').click(function(e) {
		mySwipe.prev();
	});
});
