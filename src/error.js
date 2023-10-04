const ERRORS = {
    EACCES: 403,
    EPERM: 403,
    ENOENT: 404
};

module.exports = (cause, alternative) => {
    cause = cause || {};

    const error = new Error(cause.message || cause || 'Unknow error');

    error.code = ERRORS[cause.code] || alternative || 500;

    return error;
};
