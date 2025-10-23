<script setup lang="ts">
import { Toaster } from '@renderer/components/ui/sonner'
import {
  altSign,
  ctrlKey,
  ctrlSign,
  shiftSign,
} from '@renderer/config'
import { useStore } from '@renderer/stores'
import { useDisplayStore } from '@renderer/stores'
import { addPrefix, processClipboardContent } from '@renderer/utils'
import { ChevronDownIcon, Moon, PanelLeftClose, PanelLeftOpen, Settings, Sun, SquarePen, Bold, Italic, Link, Strikethrough, Code, ClipboardType, UploadCloudIcon, TableIcon } from 'lucide-vue-next'
import emitter from '@renderer/utils/event';

const emit = defineEmits([`addFormat`, `formatContent`, `startCopy`, `endCopy`])

const formatItems = [
  {
    label: `加粗`,
    id: `bold`,
    kbd: [ctrlSign, `B`],
    emitArgs: [`addFormat`, `${ctrlKey}-B`],
  },
  {
    label: `斜体`,
    id: `italic`,
    kbd: [ctrlSign, `I`],
    emitArgs: [`addFormat`, `${ctrlKey}-I`],
  },
  {
    label: `删除线`,
    id: `strikethrough`,
    kbd: [ctrlSign, `D`],
    emitArgs: [`addFormat`, `${ctrlKey}-D`],
  },
  {
    label: `超链接`,
    id: `link`,
    kbd: [ctrlSign, `K`],
    emitArgs: [`addFormat`, `${ctrlKey}-K`],
  },
  {
    label: `行内代码`,
    id: `code`,
    kbd: [ctrlSign, `E`],
    emitArgs: [`addFormat`, `${ctrlKey}-E`],
  },
  {
    label: `格式化`,
    id: `format`,
    kbd: [altSign, shiftSign, `F`],
    emitArgs: [`formatContent`],
  },
] as const

const store = useStore()

const { isDark, isCiteStatus, isCountStatus, output, primaryColor, isOpenPostSlider } = storeToRefs(store)

const { toggleDark, editorRefresh, citeStatusChanged, countStatusChanged } = store
const { toggleShowInsertFormDialog, toggleShowUploadImgDialog } = useDisplayStore()

const copyMode = useStorage(addPrefix(`copyMode`), `txt`)
const source = ref(``)
const { copy: copyContent } = useClipboard({ source })

const toggleFormatMultiple = ref([])

// 复制到微信公众号
function copy() {
  emit(`startCopy`)
  setTimeout(() => {
    // 如果是深色模式，复制之前需要先切换到白天模式
    const isBeforeDark = isDark.value
    if (isBeforeDark) {
      toggleDark()
    }

    nextTick(async () => {
      processClipboardContent(primaryColor.value)
      const clipboardDiv = document.getElementById(`output`)!
      clipboardDiv.focus()
      window.getSelection()!.removeAllRanges()
      const temp = clipboardDiv.innerHTML
      if (copyMode.value === `txt`) {
        const range = document.createRange()
        range.setStartBefore(clipboardDiv.firstChild!)
        range.setEndAfter(clipboardDiv.lastChild!)
        window.getSelection()!.addRange(range)
        document.execCommand(`copy`)
        window.getSelection()!.removeAllRanges()
      }
      clipboardDiv.innerHTML = output.value
      if (isBeforeDark) {
        nextTick(() => toggleDark())
      }
      if (copyMode.value === `html`) {
        await copyContent(temp)
      }

      // 输出提示
      toast.success(
        copyMode.value === `html`
          ? `已复制 HTML 源码，请进行下一步操作。`
          : `已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。`,
      )

      editorRefresh()
      emit(`endCopy`)
    })
  }, 350)
}

onMounted(() => {
  emitter.on('settings', () => {
    store.isOpenRightSlider = !store.isOpenRightSlider
  })
})
</script>

<template>
  <header class="header-container h-10 flex items-center justify-between pl-20 pr-5 dark:bg-[#191c20] draggable-area">
    <div class="flex no-drag items-center">
      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="isOpenPostSlider = !isOpenPostSlider">
              <PanelLeftOpen v-show="!isOpenPostSlider" class="size-4" />
              <PanelLeftClose v-show="isOpenPostSlider" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {{ isOpenPostSlider ? "关闭" : "内容管理" }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="emitter.emit('new-file');">
              <SquarePen class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            新建
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div class="h-4 w-[1px] bg-gray-300 mx-1" />

      <TooltipProvider :delay-duration="200" v-for="{ label, kbd, emitArgs, id } in formatItems" :key="label">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              @click="emitArgs[0] === 'addFormat' ? $emit(emitArgs[0], emitArgs[1]) : $emit(emitArgs[0])"
            >
              <Bold v-if="id === 'bold'" class="size-4" />
              <Italic v-if="id === 'italic'" class="size-4" />
              <Strikethrough v-if="id === 'strikethrough'" class="size-4" />
              <Link v-if="id === 'link'" class="size-4" />
              <Code v-if="id === 'code'" class="size-4" />
              <ClipboardType v-if="id === 'format'" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
          {{ label }}
          <MenubarShortcut>
            <kbd v-for="item in kbd" :key="item" class="mx-1 bg-gray-2 dark:bg-stone-9">
              {{ item }}
            </kbd>
          </MenubarShortcut>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div class="h-4 w-[1px] bg-gray-300 mx-1" />

      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="toggleShowUploadImgDialog()">
              <UploadCloudIcon class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            上传图片
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="toggleShowInsertFormDialog()">
              <TableIcon class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            插入表格
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <HelpDropdown />
    </div>

    <div class="space-x-2 flex no-drag">
      <div class="space-x-1 bg-background text-background-foreground mx-2 flex items-center border rounded-md">
        <Button variant="ghost" class="shadow-none" @click="copy">
          复制
        </Button>
        <Separator orientation="vertical" class="h-5" />
        <DropdownMenu v-model="copyMode">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="px-2 shadow-none">
              <ChevronDownIcon class="text-secondary-foreground h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            :align-offset="-5"
            class="w-[200px]"
          >
            <DropdownMenuRadioGroup v-model="copyMode">
              <DropdownMenuRadioItem value="txt">
                公众号格式
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="html">
                HTML 格式
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Toaster rich-colors position="top-center" />
    </div>
  </header>
</template>

<style lang="less" scoped>
.menubar {
  user-select: none;
}

kbd {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #a8a8a8;
  padding: 1px 4px;
  border-radius: 2px;
}
</style>
