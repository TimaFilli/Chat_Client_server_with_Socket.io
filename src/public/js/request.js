const API = "http://localhost:5000"

async function request(path, method, body) {
    try {

        let headers = {}

        if (path != "/register" && path != "/login") {
            headers.token = JSON.parse(window.localStorage.getItem('response')).token
        }

        if (!(body instanceof FormData)) {
            body = JSON.stringify(body)
            headers['Content-Type'] = 'application/json'
        }

        let response = await fetch(API + path, {
            method: method || 'GET',
            headers,
            body
        })

        return await response.json()

    } catch (error) {
        return {
            status: 400,
            message: error.message
        }
    }
}