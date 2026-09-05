function buscarJogos() {
    
    const termo = document.getElementById('campoPesquisa').value.toLowerCase().trim();

   
    const paginas = {
        "minecraft": "jogos/minecraft.html",
        "god of war": "jogos/godofwarragnarok.html",
        "batman arkham night": "jogos/batmanarkhamnight.html",
        "cuphead": "jogos/cuphead.html",
        "red dead redemption 2": "jogos/reddead2.html",
        "resident evil 5" : "jogos/residentevil5.html"
    };

    
    if (paginas[termo]) {
        
        window.location.href = paginas[termo];
    } else {
        
        alert("Jogo não encontrado ou indisponível.");
    }
}
