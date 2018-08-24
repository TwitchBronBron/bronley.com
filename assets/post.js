//document.ready
if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('document was not ready, place code here');
        init();
    });
}

function saveUserInfo(form) {
    var name = form.getElementsByClassName('name-input')[0].value;
    var emailAddress = form.getElementsByClassName('email-address-input')[0].value;
    document.cookie = "name=" + name + "; expires=Thu, 18 Dec 2030 12:00:00 UTC; path=/";
    document.cookie = "emailAddress=" + emailAddress + "; expires=Thu, 18 Dec 2030 12:00:00 UTC; path=/";
}

function loadUserInfo(form) {
    var cookies = document.cookie;
    var name = getCookie('name');
    if (name) {
        form.getElementsByClassName('name-input')[0].value = name;
    }
    var emailAddress = getCookie('emailAddress');
    if (emailAddress) {
        form.getElementsByClassName('email-address-input')[0].value = emailAddress;
    }

}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function showReplyForm(element) {
    //hide all nested reply forms
    resetVisibility();

    //remove all comment nesting when adding a comment 
    document.body.classList.add('nested-reply-active');

    //hide the "reply" anchor
    element.classList.add('hide');

    //show the form
    var form = element.nextElementSibling;
    loadUserInfo(form);
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
            loadUserInfo(element);
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