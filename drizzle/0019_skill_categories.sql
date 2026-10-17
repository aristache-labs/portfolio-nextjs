UPDATE "skills"
SET "category" = CASE
  WHEN "name" IN ('PowerShell', 'Bash', 'Ansible', 'AiScript') THEN 'Automation'
  WHEN "name" IN ('AWS', 'Azure', 'Cloudflare') OR "category" = 'Data' THEN 'Data & Cloud'
  WHEN "category" = 'Systems' THEN 'Infrastructure'
  WHEN "category" IN ('Languages', 'Frameworks') THEN 'Development'
  ELSE "category"
END
WHERE "category" IN ('Languages', 'Frameworks', 'Data', 'Systems')
   OR "name" IN ('PowerShell', 'Bash', 'Ansible', 'AiScript', 'AWS', 'Azure', 'Cloudflare');
