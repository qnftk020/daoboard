import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'
import dotenv from 'dotenv'
import { handleVibeCommand } from './commands/vibe'

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

// Slash command definition
const vibeCommand = new SlashCommandBuilder()
  .setName('vibe')
  .setDescription('바이브 코딩 세션 관리')
  .addStringOption((option) =>
    option
      .setName('command')
      .setDescription('명령어')
      .setRequired(true)
      .addChoices(
        { name: 'start - 세션 시작', value: 'start' },
        { name: 'log - 진행상황 기록', value: 'log' },
        { name: 'milestone - 마일스톤 달성', value: 'milestone' },
        { name: 'task add - 태스크 추가', value: 'task_add' },
        { name: 'task done - 태스크 완료', value: 'task_done' },
        { name: 'end - 세션 종료', value: 'end' },
      )
  )
  .addStringOption((option) =>
    option.setName('content').setDescription('내용').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('team')
      .setDescription('팀 선택')
      .setRequired(false)
      .addChoices(
        { name: '1팀', value: '1' },
        { name: '2팀', value: '2' },
        { name: '3팀', value: '3' },
        { name: '4팀', value: '4' },
        { name: '5팀', value: '5' },
        { name: '테스트', value: 'test' },
      )
  )

// Register slash commands
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)
  try {
    console.log('🔄 슬래시 커맨드 등록 중...')
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, DISCORD_GUILD_ID), {
      body: [vibeCommand.toJSON()],
    })
    console.log('✅ 슬래시 커맨드 등록 완료!')
  } catch (error) {
    console.error('❌ 커맨드 등록 실패:', error)
  }
}

client.once('ready', () => {
  console.log(`⚡ DAOboard Bot 온라인! (${client.user?.tag})`)
  registerCommands()
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName === 'vibe') {
    await handleVibeCommand(interaction)
  }
})

client.login(DISCORD_BOT_TOKEN)
