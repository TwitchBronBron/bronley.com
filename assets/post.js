function showReplyForm(element) {
    //hide all nested reply forms
    resetVisibility();

    //remove all comment nesting when adding a comment 
    document.body.classList.add('nested-reply-active');

    //hide the "reply" anchor
    element.classList.add('hide');

    //show the form
    var form = element.nextElementSibling;
    form.classList.remove('hide');
    form.getElementsByClassName('name-input')[0].focus();
}

function cancelReply(element) {
    //show the reply anchor
    element.parentElement.parentElement.getElementsByClassName('comment-reply-anchor')[0].classList.remove('hide');

    //hide the form
    var form = element.parentElement;
    form.classList.add('hide');

    //remove all comment nesting when adding a comment 
    document.body.classList.remove('nested-reply-active');

    //hide all nested reply forms
    resetVisibility();
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
    resetVisibility();
}

function resetVisibility() {
    //hide all of the reply forms
    var elements = document.getElementsByClassName('add-comment-form');
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        //skip the root comment form
        if (element.classList.contains('root-comment-form')) {
            continue;
        }
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