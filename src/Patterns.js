module.exports = {
    alnum: '[\\da-zA-Z]+',
    alpha: '[a-zA-Z]+',
    decimal: '(\\d|[1-9]\\d+)\\.\\d+',
    nospace: '[^/\\s]+',
    num: '\\d+',
    uuid: '[\\da-fA-F]{8}-[\\da-fA-F]{4}-[\\da-fA-F]{4}-[\\da-fA-F]{4}-[\\da-fA-F]{12}',
    version: '\\d+\\.\\d+(\\.\\d+(-[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*(\\+[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*)?)?)?'
};
