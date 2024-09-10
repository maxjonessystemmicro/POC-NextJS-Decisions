
document.querySelectorAll('label').forEach(function (item) {
    if (item.innerText.includes('Maximus')) {
        console.dir(item.innerText);
        localStorage.setItem("ExpectedPayload", JSON.stringify({UserEmail:null,Message:item.innerText,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}));
        
    }
});

