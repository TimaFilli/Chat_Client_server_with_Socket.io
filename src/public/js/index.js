const socket = io({
    auth: {
        token: window.localStorage.getItem('token')
    }
})

let firstUserId

async function getUsers() {
    const users = await request('/users')
    renderUsers(users)
}

async function getMessages(userId) {
    const messages = await request('/messages?userId=' + userId)
    renderMessages(messages, userId)
}

async function postMessage(body, type) {
    if (type === 'text') {
        const response = await request('/messages', 'POST', {
            messageTo: firstUserId,
            messageBody: body
        })

        if(response.status > 400) {
            return alert(response.message)
        }

        renderMessages([response.data])
    } else if (type === 'file') {
        const formData = new FormData()
        formData.append('messageTo', firstUserId)
        formData.append('messageBody', 'hello world')
        formData.append('file', body)

        const response = await request('/messages', 'POST', formData)

        if(response.status > 400) {
            return alert(response.message)
        }

        renderMessages([response.data])
    }
}

async function renderMessages(messages, hisId) {
    for (let message of messages) {
        const isHisMessage = message.message_from.user_id == hisId

        const img = '/getFile/' + message.message_from.user_img + '/' + token
        const file = '/getFile/' + message.message_body + '/' + token
        const downloadLink = '/download/' + message.message_body + '/' + token
        const username = message.message_from.username

        const date = new Date(message.created_at)
        const hour = date.getHours().toString().padStart(2, 0)
        const minute = date.getMinutes().toString().padStart(2, 0)
        const time = hour + ':' + minute

        if (message.message_type === 'plain/text') {
            chatsMain.innerHTML += `
                <div class="msg-wrapper ${isHisMessage ? '' : 'msg-from'}">
                    <img src="${img}" alt="profile-picture">
                    <div class="msg-text">
                        <p class="msg-author">${username}</p>
                        <p class="msg">${message.message_body}</p>
                        <p class="time">${time}</p>
                    </div>
                </div>
            `
        } else {
            uploadedFiles.innerHTML += `
                <li class="uploaded-file-item">
                    <a target="__blank" href="${file}">
                        <img src="./img/file.png" alt="file" width="30px">
                        <p>${message.message_body}</p>
                    </a>
                </li>
            `


            chatsMain.innerHTML += `
                <div class="msg-wrapper ${isHisMessage ? '' : 'msg-from'}">
                    <img src="${img}" alt="profile-picture">
                    <div class="msg-text">
                        <p class="msg-author">${username}</p>
                        <object paused data="${file}" type="${message.message_type}" class="msg object-class"></object>
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

async function renderUsers(users) {
    for (let user of users) {
        const userImg = new String(`/getFile/${user.user_img}/${token}`)
        
        chatsList.innerHTML += `
            <li class="chats-item"
                onclick="(async function () {
                    await setChat('${userImg}', '${user.username}', ${user.user_id})

                    chatsMain.innerHTML = null
                    uploadedFiles.innerHTML = null
                    await getMessages(${user.user_id})
                })()"
            >
                <img src="${userImg}" alt="profile-picture">
                <p>
                    ${user.username} 
                    <span data-id="${user.user_id}" class="${user.socket_id ? 'online-indicator' : ''}"></span>
                </p>
            </li>
        `
    }
}

async function renderAvatarData() {
    profileAvatar.src = '/getPhoto/' + token
    let response = await request('/getUsername/' + token)
    profileUsername.textContent = response.username

}

function setChat(img, username, userId) {
    chatPhoto.src = img
    chatUsername.textContent = username
    firstUserId = userId
    form.style.display = 'flex'
}

logOut.onclick = () => {
    window.localStorage.clear()
    window.location = '/login'
}

form.onsubmit = async event => {
    event.preventDefault()

    if (textInput.value.trim().length > 250) {
        return alert('invalid input!')
    }

    if (!textInput.value.trim()) {
        return textInput.value = null
    }

    await postMessage(textInput.value, 'text')
    form.reset()
}

uploads.onchange = event => {
    if (uploads.files[0].size > 50 * 1024 * 1024) {
        return alert('Invalid file size!')
    }

    socket.emit('user:filing', { to: firstUserId })
    postMessage(uploads.files[0], 'file')
    form.reset()
}

let setTimeoutId
textInput.onkeyup = event => {
    if (setTimeoutId) return 

    socket.emit('user:typing', { to: firstUserId })
    setTimeoutId = setTimeout(() => {
        socket.emit('user:stopping', { to: firstUserId })
        setTimeoutId = null
    }, 2000)
}

socket.on('exit', () => {
    window.localStorage.clear()
    window.location = '/login'
})

socket.on('user:online', ({ userId }) => {
    const span = document.querySelector(`[data-id='${userId}']`)
    span.classList.add('online-indicator')
})

socket.on('user:offline', ({ userId }) => {
    const span = document.querySelector(`[data-id='${userId}']`)
    span.classList.remove('online-indicator')
})

socket.on('message:new', (message) => {
    chatAction.textContent = null

    if (message.message_from.user_id == firstUserId) {
        renderMessages([message], firstUserId)
    }
})

socket.on('user:typing', ({ from }) => {
    if (from == firstUserId) {
        chatAction.textContent = 'is typing...'
    }
})

socket.on('user:stopping', ({ from }) => {
    if (from == firstUserId) {
        chatAction.textContent = ''
    }
})

socket.on('user:filing', ({ from }) => {
    if (from == firstUserId) {
        chatAction.textContent = 'is sending a file...'
    }
})

renderAvatarData()
getUsers()