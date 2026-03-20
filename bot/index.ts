import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'
import dotenv from 'dotenv'
import { handleDaoboardCommand, loadChannelTeamMap } from './commands/daoboard'

dotenv.config({ path: '.env.local' })

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// /daoboard 명령어 (서브커맨드 방식)
const daoboardCommand = new SlashCommandBuilder()
  .setName('daoboard')
  .setDescription('DAOboard 프로젝트 기록')
  .addSubcommand((sub) =>
    sub
      .setName('start')
      .setDescription('🚀 세션 시작')
      .addStringOption((opt) => opt.setName('content').setDescription('세션 이름').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('log')
      .setDescription('📝 진행상황 기록')
      .addStringOption((opt) => opt.setName('content').setDescription('기록할 내용').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('task')
      .setDescription('📋 태스크 추가')
      .addStringOption((opt) => opt.setName('content').setDescription('태스크 이름').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('done')
      .setDescription('✅ 태스크 완료')
      .addStringOption((opt) => opt.setName('content').setDescription('완료한 태스크 이름').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('milestone')
      .setDescription('🏆 마일스톤 달성')
      .addStringOption((opt) => opt.setName('content').setDescription('마일스톤 이름').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('end')
      .setDescription('🏁 세션 종료')
      .addStringOption((opt) => opt.setName('content').setDescription('종료 메모 (선택)').setRequired(false))
  )

// Register commands
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)
  try {
    console.log('🔄 슬래시 커맨드 등록 중...')
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, DISCORD_GUILD_ID), {
      body: [daoboardCommand.toJSON()],
    })
    console.log('✅ /daoboard 커맨드 등록 완료!')
  } catch (error) {
    console.error('❌ 커맨드 등록 실패:', error)
  }
}

client.once('ready', async () => {
  console.log(`⚡ DAOboard Bot 온라인! (${client.user?.tag})`)
  await registerCommands()
  await loadChannelTeamMap()
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName === 'daoboard') {
    await handleDaoboardCommand(interaction)
  }
})

client.login(DISCORD_BOT_TOKEN)
