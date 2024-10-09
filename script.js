let prd = null;
let uuid = '';

function headers() {
    return {
        'X-Key': 'Key ' + token.value,
        'X-Secret': 'Secret ' + secret.value,
    };
}

function params() {
    return {
        type: "GENERATE",
        style: style.value,
        width: width.value,
        height: height.value,
        num_images: 1,
        negativePromptUnclip: negative.value,
        generateParams: {
            query: query.value,
        }
    };
}

async function generate() {
    // Показываем индикатор загрузки
    document.getElementById('loader').style.display = 'block';
    document.getElementById('img').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';

    let model_id = 0;
    try {
        let res = await fetch('https://api-key.fusionbrain.ai/key/api/v1/models', {
            method: 'GET',
            headers: headers(),
        });
        res = await res.json();
        model_id = res[0].id;
    } catch (error) {
        console.error('Ошибка получения модели:', error);
        hideLoader();
        return;
    }

    let formData = new FormData();
    formData.append('model_id', model_id);
    formData.append('params', new Blob([JSON.stringify(params())], { type: "application/json" }));

    let res;
    try {
        res = await fetch('https://api-key.fusionbrain.ai/key/api/v1/text2image/run', {
            method: 'POST',
            headers: headers(),
            body: formData,
        });
        let json = await res.json();
        uuid = json.uuid;
        if (uuid) prd = setInterval(check, 3000);
    } catch (error) {
        console.error('Ошибка генерации изображения:', error);
        hideLoader();
    }
}

async function check() {
    let res;
    try {
        res = await fetch('https://api-key.fusionbrain.ai/key/api/v1/text2image/status/' + uuid, {
            method: 'GET',
            headers: headers(),
        });
        let json = await res.json();

        switch (json.status) {
            case 'INITIAL':
            case 'PROCESSING':
                break;

            case 'DONE':
                document.getElementById('img').src = 'data:image/jpeg;charset=utf-8;base64,' + json.images[0];
                document.getElementById('img').style.display = 'block';
                document.getElementById('downloadBtn').style.display = 'block';
                clearInterval(prd);
                hideLoader();
                break;

            case 'FAIL':
                clearInterval(prd);
                hideLoader();
                console.error('Ошибка: генерация изображения не удалась.');
                break;
        }
    } catch (error) {
        console.error('Ошибка проверки статуса:', error);
        clearInterval(prd);
        hideLoader();
    }
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

window.onload = async () => {
    try {
        let res = await fetch('https://cdn.fusionbrain.ai/static/styles/web');
        res = await res.json();
        for (let style of res) {
            document.getElementById('style').innerHTML += `<option value="${style.name}">${style.name}</option>`;
        }
    } catch (error) {
        console.error('Ошибка загрузки стилей:', error);
    }
};
