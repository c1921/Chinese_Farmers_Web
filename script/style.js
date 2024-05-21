window.onload = function () {
    // 获取header和footer元素
    var header = document.getElementById('header');
    var footer = document.getElementById('footer');
    var formControls = document.getElementById('FormControls');

    // 计算header的总高度（包含margin）
    var headerHeight = header.offsetHeight;
    var headerMarginTop = parseInt(window.getComputedStyle(header).marginTop);
    var headerMarginBottom = parseInt(window.getComputedStyle(header).marginBottom);
    var totalHeaderHeight = headerHeight + headerMarginTop + headerMarginBottom;

    // 计算footer的总高度（包含margin）
    var footerHeight = footer.offsetHeight;
    var footerMarginTop = parseInt(window.getComputedStyle(footer).marginTop);
    var footerMarginBottom = parseInt(window.getComputedStyle(footer).marginBottom);
    var totalFooterHeight = footerHeight + footerMarginTop + footerMarginBottom;

    // 计算FormControls的总高度（包含margin）
    var formControlsHeight = formControls.offsetHeight;
    var formControlsMarginTop = parseInt(window.getComputedStyle(formControls).marginTop);
    var formControlsMarginBottom = parseInt(window.getComputedStyle(formControls).marginBottom);
    var totalFormControlsHeight = formControlsHeight + formControlsMarginTop + formControlsMarginBottom;

    // 计算header和footer的总高度
    var totalHeaderFooterHeight = totalHeaderHeight + totalFooterHeight;

    // 设置CSS变量
    document.documentElement.style.setProperty('--header-height', totalHeaderHeight + 'px');
    document.documentElement.style.setProperty('--footer-height', totalFooterHeight + 'px');
    document.documentElement.style.setProperty('--header-footer-height', totalHeaderFooterHeight + 'px');
    document.documentElement.style.setProperty('--form-controls-height', totalFormControlsHeight + 'px');
}