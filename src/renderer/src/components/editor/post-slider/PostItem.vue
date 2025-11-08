<script setup lang="ts">
import {
  Edit3,
  Ellipsis,
  History,
  Trash2,
} from 'lucide-vue-next'
import { useStore } from '@/stores'
import type { Post } from '@/types/post'

const props = defineProps<{
  // 文章对象
  post: Post
  // 开始重命名文章
  startRenamePost: (id: string) => void
  // 打开历史记录对话框
  openHistoryDialog: (id: string) => void
  // 开始删除文章
  startDelPost: (id: string) => void
  // 拖拽目的地 ID
  dropTargetId: string | null
  // 设置拖拽目的地
  setDropTargetId: (id: string | null) => void
  // 被拖拽对象
  dragSourceId: string | null
  // 设置被拖拽对象
  setDragSourceId: (id: string | null) => void
  handleDrop: (targetId: string | null) => void
  handleDragEnd: () => void
}>()

const store = useStore()

// 拖拽开始时记录ID并设置数据
function handleDragStart(id: string, e: DragEvent) {
  props.setDragSourceId(id)
  e.dataTransfer?.setData(`text/plain`, id)
  e.dataTransfer!.effectAllowed = `move`
}
</script>

<template>
  <a
    class="w-full inline-flex cursor-pointer items-center gap-1 rounded p-2 text-sm transition-colors"
    :class="[
      // eslint-disable-next-line vue/prefer-separate-static-class
      'hover:text-primary-foreground hover:bg-primary',
      {
        'bg-primary text-primary-foreground shadow-sm': store.currentPostId === post.id,
        'opacity-50': props.dragSourceId === post.id,
        'outline-2 outline-dashed outline-primary border-gray-200 bg-gray-400/50 dark:border-gray-200 dark:bg-gray-500/50':
          props.dropTargetId === post.id,
      },
    ]"
    draggable="true"
    @dragstart="handleDragStart(post.id, $event)"
    @dragend="props.handleDragEnd"
    @drop.prevent="props.handleDrop(post.id)"
    @dragover.stop.prevent="props.setDropTargetId(post.id)"
    @dragleave.prevent="props.setDropTargetId(null)"
    @click="store.currentPostId = post.id"
  >
    <span class="line-clamp-1 flex-1">{{ post.title }}</span>

    <!-- 每条文章操作 -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="xs"
          variant="ghost"
          class="ml-auto h-max p-0.5"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click.stop="props.startRenamePost(post.id)">
          <Edit3 class="mr-2 size-4" /> 重命名
        </DropdownMenuItem>
        <DropdownMenuItem @click.stop="props.openHistoryDialog(post.id)">
          <History class="mr-2 size-4" /> 历史记录
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="store.posts.length > 1"
          @click.stop="props.startDelPost(post.id)"
        >
          <Trash2 class="mr-2 size-4" /> 删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </a>
</template>
