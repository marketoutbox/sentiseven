// Simple test function to check CSV accessibility
export const testCSVAccess = async () => {
  try {
    console.log('Testing CSV access...')
    const response = await fetch('/list.csv')
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const text = await response.text()
    console.log('CSV content length:', text.length)
    console.log('First 200 chars:', text.substring(0, 200))
    
    return { success: true, length: text.length }
  } catch (error) {
    console.error('CSV test failed:', error)
    return { success: false, error: error.message }
  }
}