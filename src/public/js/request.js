const API = "http://localhost:5000"

async function request(path, method, body) {
    try {
        
        const headers = {
            token: window.localStorage.getItem('token')
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
        console.log(error)
    }
}