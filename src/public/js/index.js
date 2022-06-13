const socket = io(API, {
    auth: {
        username: username,
        token
    }
})

!async function () {
    const user = await request("/userData")
    adminAvatar.src = `${API}/${user.avatar}`
    adminUsername.textContent = user.username
}()


let firstUserId
let userAvatarUrl
let users
getUsers()

async function getUsers() {
    users = await request('/users')
    renderUsers(users)
}

async function renderUsers(users) {
    chatsList.innerHTML = null
    for (let user of users) {
        const li = document.createElement("li")
        const img = document.createElement("img")
        const p = document.createElement("p")
        const div = document.createElement("div")
        userAvatarUrl = API + "/" + user.avatar

        li.className = "chats-item"
        img.src = userAvatarUrl
        div.className = user.socket_id ? 'online-user' : ''
        p.textContent = user.username

        li.append(img, div, p)
        chatsList.append(li)
        
        li.addEventListener("click", async () => {
                    chatsMain.innerHTML = null
                    uploadedFiles.innerHTML = null
                    chatPhoto.src = userAvatarUrl
                    chatUsername.textContent = user.username
                    firstUserId = user.user_id
                    form.style.display = 'flex'
                    await getMessages(user.user_id)
        })
    }
}

async function getMessages(userId) {
    const messages = await request('/messages?userId=' + userId)
    renderMessages(messages, userId)
}


async function renderMessages(messages, hisId) {
    for (let message of messages) {
        const isHisMessage = message.messageFrom == hisId

        const img = isHisMessage ? userAvatarUrl : API + "/" + response.data.avatar
        const file = API + "/" + message.message
        const downloadLink = API + '/download/' + message.message

        const date = new Date(message.createdAt)
        const hour = date.getHours().toString().padStart(2, 0)
        const minute = date.getMinutes().toString().padStart(2, 0)
        const time = hour + ':' + minute

        if (message.messageType === 'plain/text') {
            chatsMain.innerHTML += `
                <div class="msg-wrapper ${isHisMessage ? '' : 'msg-from'}">
                    <img src="${img}" alt="profile-picture">
                    <div class="msg-text">
                        <p class="msg-author">${username}</p>
                        <p class="msg">${message.message}</p>
                        <p class="time">${time}</p>
                    </div>
                </div>
            `
        } else {
            uploadedFiles.innerHTML += `
                <li class="uploaded-file-item">
                    <a target="__blank" href="${file}">
                        <img src="./img/file.png" alt="file" width="30px">
                        <p>${message.message}</p>
                    </a>
                </li>
            `

            chatsMain.innerHTML += `
                <div class="msg-wrapper ${isHisMessage ? '' : 'msg-from'}">
                    <img src="${img}" alt="profile-picture">
                    <div class="msg-text">
                        <p class="msg-author">${username}</p>
                        <object paused data="${file}" type="${message.messageType}" class="msg object-class"></object>
                        <a href="${downloadLink}">
                            <img src="./img/download.png" width="25px">
                        </a>
                        <p class="time">${time}</p>
                    </div>
                </div>
            `
        }
    }
    chatsMain.scrollTo({
        top: 1000000000,
    })
}


form.onsubmit = async event => {
    event.preventDefault()
    
    if (!textInput.value.trim()) return
    if (textInput.value.trim().length > 100) return alert('Invalid input length!')
    if (!textInput.value.trim()) return textInput.value = null

    await postMessage(textInput.value, 'text')
    form.reset()
}

uploads.onchange = event => {
    if (uploads.files[0].size > 50 * 1024 * 1024) return alert('Invalid file size!')

    // socket.emit('user sending', { to: firstUserId })
    postMessage(uploads.files[0], uploads.files[0].type)
    form.reset()
}

async function postMessage(message, type) {
    let response
    if (type === 'text') {
        response = await request('/messages', 'POST', {
            messageBody: message,
            messageTo: firstUserId,
            messageType: type
        })

        if(response.status > 400) {
            return alert(response.message)
        }

    } else {
        const formData = new FormData()
        formData.append('messageTo', firstUserId)
        formData.append('messageType', type)
        formData.append('file', message)

        response = await request('/messages', 'POST', formData)

        if(response.status > 400) {
            return alert(response.message)
        }

    }
    renderMessages([response])
}


logOutBtn.onclick = () => {
    window.localStorage.clear()
    window.location = '/login'
}

// let setTimeoutId
// textInput.onkeyup = event => {
//     if (setTimeoutId) return 

//     socket.emit('typing', { to: firstUserId })
//     setTimeoutId = setTimeout(() => {
//         socket.emit('stopping', { to: firstUserId })
//         setTimeoutId = null
//     }, 2000)
// }

socket.on('exit', () => {
    window.localStorage.clear()
    window.location = '/login'
})

socket.on('connected', () => {
    return getUsers()
})

socket.on('disconnected', () => {
    return getUsers()
})

// socket.on('message:new', (message) => {
//     chatAction.textContent = null

//     if (message.message_from.user_id == firstUserId) {
//         renderMessages([message], firstUserId)
//     }
// })

// socket.on('typing', ({ from }) => {
//     if (from == firstUserId) {
//         chatAction.textContent = 'is typing...'
//     }
// })

// socket.on('stopping', ({ from }) => {
//     if (from == firstUserId) {
//         chatAction.textContent = ''
//     }
// })

// socket.on('user sending', ({ from }) => {
//     if (from == firstUserId) {
//         chatAction.textContent = 'is sending a file...'
//     }
// })