module.exports = function (name) {
    return 'tmpl_' + name.replace(/[^A-Za-z0-9]/g, '_');
};