import db from '../lib/database/index.js'

let cooldown = isPrems => isPrems ? 30000 : 60000
let handler = async (m, { isPrems, conn: _conn, conn }) => {
  const user = await db.users.get(m.sender)
  
  let pengali = 1
  if (m.chat == '120363143522564771@g.us') {
    pengali = 2
  }
  
  const rewards = {
    coinly: user.dragon ? 10 : Math.min((1 + user.dog) * pengali, 5)
  }
  
  if (user.nama == '-' || user.gender == 'non-binary 🎭' || user.umur == '-') {
    conn.sendFile(m.chat, './picture/tutorial/tutorial.jpeg', './picture/tutorial/tutorial.jpeg', `⚠️ Anda belum set profile (cek dengan /profile)\nAnda bisa set profile dengan /set`, m)
    return
  }
  
  let silent = 1 
  if (user.silent != true) {
    silent = 4
  }
  let safezone = 1
  if (user.safezone == true) {
    safezone = 10
  }
  let extra = safezone * silent
  
  if (new Date - user.lastcoinly < cooldown(isPrems) * extra) {
    const remainingTime = ((user.lastcoinly + cooldown(isPrems) * extra) - new Date()).toTimeString()
    throw `Kamu sudah ambil 🧭 coinly!, tunggu selama *${remainingTime}*`
  }
  
  let text = ''
  
  await db.users.update(m.sender, (user) => {
      for (let reward of Object.keys(rewards)) {
        if (!(reward in user)) continue
        user[reward] += rewards[reward]
        text += `*+${rewards[reward]}* ${global.rpg.emoticon(reward)}${reward}\n`
        user.lastcoinly = new Date() * 1
      }
  })
  
  if (user.silent == false) {
    m.reply(text.trim())
  }
}
handler.help = ['coinly']
handler.tags = ['click']
handler.command = /^(coinly|c)$/i

handler.cooldown = cooldown

export default handler
