function showDiv(divId, element) {
    // 隐藏所有内容
    var contents = document.querySelectorAll('.content');
    contents.forEach(function (content) {
        content.classList.remove('active');
    });
    // 显示选中的内容
    document.getElementById(divId).classList.add('active');

    // 移除所有li的is-active类
    var tabs = document.querySelectorAll('.tabs li');
    tabs.forEach(function (tab) {
        tab.classList.remove('is-active');
    });
    // 给当前点击的li添加is-active类
    element.parentElement.classList.add('is-active');
}