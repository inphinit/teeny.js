module.exports = {
    alnum: '[\\da-zA-Z]+',
    alpha: '[a-zA-Z]+',
    decimal: '\\d+\\.\\d+',
    num: '\\d+',
    noslash: '[^\\/]+',
    nospace: '\\S+',
    uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    version: '\\d+\\.\\d+(\\.\\d+(-[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*(\\+[\\da-zA-Z]+(\\.[\\da-zA-Z]+)*)?)?)?'
};
