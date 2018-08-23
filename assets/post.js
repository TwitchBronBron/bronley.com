function showReplyForm(element) {
    element.classList.add('hide');
    var form = element.nextElementSibling;
    form.classList.remove('hide');
}

function cancelReply(element){
    element.parentElement.parentElement.getElementsByClassName('comment-reply-anchor')[0].classList.remove('hide');
    var form = element.parentElement;
    form.classList.add('hide');
}

if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('document was not ready, place code here');
        init();
    });
}

//progressive enhancement
function init() {
    //hide all of the reply forms
    var elements = document.getElementsByClassName('add-comment-form');
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];

        element.classList.add('hide');
    }

    //show all of the reply anchors
    var elements = document.getElementsByClassName('comment-reply-anchor');
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        element.nextElementSibling
        element.classList.remove('hide');
    }
}