module.exports = function (name) {
    return '["' + name.join('"]["') + '"]';
};