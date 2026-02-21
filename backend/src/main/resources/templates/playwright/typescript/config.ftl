{
  "baseUrl": "${baseUrl}",
  "authToken": "${authToken!""}",
  "headers": {
  <#if headers??>
    <#list headers?keys as key>
      "${key}": "${headers[key]}"<#if key_has_next>,</#if>
    </#list>
  </#if>
  }
}
