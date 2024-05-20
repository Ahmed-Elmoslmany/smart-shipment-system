class AppError extends Error{
    constructor(message, statusCode, field = "", type = ""){
        super(message) // This line because default Error class receive string as argument is equal {this.message = message}

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true // We put it here because we would know if error is operational or programatic error
        this.field = field
        this.type = type

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError