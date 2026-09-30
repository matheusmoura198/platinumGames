function buscarJogos() {
    
    const termo = document.getElementById('campoPesquisa').value.toLowerCase().trim();

   switch (termo) {
    case "minecraft":
         window.location.href = "jogos/minecraft.html"
         break
    case "batman arkham night":
        window.location.href = "jogos/batmanarkhamnight.html"
        break
    case "cuphead":
        window.location.href = "jogos/cuphead.html"
        break
    case "red dead redemption 2":
        window.location.href = "jogos/reddead2.html"
        break
    case "resident evil 5" :
        window.location.href = "jogos/residentevil5.html"
        break
    case "marvel's spiderman" :
        window.location.href = "jogos/marvel'sspiderman.html"
        break
    case "hollow knight" :
        window.location.href = "jogos/hollowKnight.html"
        break
    case "crash bandicoot 4:it's about time":
        window.location.href = "jogos/crashBandicoot4It'sAboutTime.html"
        break
    default:
        alert("Jogo não encontrado ou indisponível.")
   }
}
