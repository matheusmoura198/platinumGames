function buscarJogos() {
    
    const termo = document.getElementById('campoPesquisa').value.toLowerCase().trim();

   
    const paginas = {
        "minecraft": "jogos/minecraft.html",
        "batman arkham night": "jogos/batmanarkhamnight.html",
        "cuphead": "jogos/cuphead.html",
        "red dead redemption 2": "jogos/reddead2.html",
        "resident evil 5" : "jogos/residentevil5.html",
        "marvel's spiderman" : "jogos/marvel'sspiderman.html",
        "hollow knight" : "holowKnight.html",
        "crash bandicoot 4:it's about time" : "crashBandicoot4It'sAboutTime.html",
    };

    
    if (paginas[termo]) {
        
        window.location.href = paginas[termo];
    } else {
        
        alert("Jogo não encontrado ou indisponível.");
    }
}
