module.exports = (package) => {
    try {
        return require('node:' + package);
    } catch (_) {
        return require(package);
    }
};
