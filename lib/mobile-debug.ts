// Mobile debugging utilities for stock selector issues
export const getMobileDebugInfo = () => {
  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isIOSWebView = /iPhone|iPad/.test(userAgent) && /AppleWebKit/.test(userAgent) && !/Safari/.test(userAgent)
  const isAndroidWebView = /wv/.test(userAgent) && /Android/.test(userAgent)
  
  return {
    userAgent,
    isMobile,
    isIOSWebView,
    isAndroidWebView,
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsFetch: 'fetch' in window,
    online: navigator.onLine,
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : null,
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        return true
      } catch {
        return false
      }
    })(),
    sessionStorage: (() => {
      try {
        sessionStorage.setItem('test', 'test')
        sessionStorage.removeItem('test')
        return true
      } catch {
        return false
      }
    })()
  }
}

export const testMobileCSVAccess = async () => {
  const debugInfo = getMobileDebugInfo()
  console.log('Mobile Debug Info:', debugInfo)
  
  try {
    console.log('Testing mobile CSV access...')
    
    // Test basic fetch capability
    const testResponse = await fetch('/placeholder.svg', { method: 'HEAD' })
    console.log('Basic fetch test (placeholder.svg):', testResponse.ok, testResponse.status)
    
    // Test CSV file specifically
    const csvResponse = await fetch('/list.csv', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
    console.log('CSV file HEAD request:', csvResponse.ok, csvResponse.status)
    
    if (csvResponse.ok) {
      // Try to fetch actual content
      const contentResponse = await fetch('/list.csv', {
        cache: 'no-cache',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      })
      console.log('CSV content fetch:', contentResponse.ok, contentResponse.status)
      
      if (contentResponse.ok) {
        const text = await contentResponse.text()
        console.log('CSV content length:', text.length)
        console.log('CSV first line:', text.split('\n')[0])
        return { success: true, length: text.length, debugInfo }
      }
    }
    
    throw new Error(`CSV not accessible: ${csvResponse.status}`)
    
  } catch (error) {
    console.error('Mobile CSV test failed:', error)
    return { success: false, error: error.message, debugInfo }
  }
}