const socket = new WebSocket('wss://yourserver.com/socket'); // WebSocket sunucu adresinizi buraya ekleyin

socket.onopen = function(event) {
    console.log('WebSocket bağlantısı açıldı:', event);
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // Mesaj alındığında yapılacak işlemler
    console.log('Mesaj alındı:', data);
};

socket.onclose = function(event) {
    console.log('WebSocket bağlantısı kapandı:', event);
};

socket.onerror = function(error) {
    console.error('WebSocket hatası:', error);
};

// Mesaj göndermek için bir fonksiyon
function sendMessage(message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket bağlantısı açık değil.');
    }
}