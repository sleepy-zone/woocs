<script setup lang="ts">
import emitter from '@renderer/utils/event';

const aboutDialogVisible = ref(false)

onMounted(() => {
  emitter.on('about', () => {
    aboutDialogVisible.value = true
  })
})
</script>

<template>
  <!-- <MenubarMenu>
    <MenubarTrigger>
      帮助
    </MenubarTrigger>
    <MenubarContent align="start">
      <MenubarCheckboxItem @click="aboutDialogVisible = true">
        <span>关于</span>
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu> -->

  <AboutDialog :visible="aboutDialogVisible" @close="aboutDialogVisible = false" />
</template>
