import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'HelloPlugin',
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const name = ref('')
    const message = ref('')
    const loading = ref(false)

    async function greet() {
      loading.value = true
      try {
        const result = await props.context.invoke('greet', { name: name.value || 'World' })
        const data = JSON.parse(result)
        message.value = data.message || data.error || 'No response'
      } catch (e) {
        message.value = 'Error: ' + e
      } finally {
        loading.value = false
      }
    }

    return {
      name,
      message,
      loading,
      greet
    }
  },
  template: `
    <div class="hello-plugin">
      <h3>Hello Plugin</h3>
      <p>{{ message || 'Click the button to greet!' }}</p>
      <input v-model="name" type="text" placeholder="Enter name..." />
      <button @click="greet" :disabled="loading">Greet</button>
    </div>
  `
})