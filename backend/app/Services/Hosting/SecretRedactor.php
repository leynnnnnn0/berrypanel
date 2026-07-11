<?php
namespace App\Services\Hosting;
class SecretRedactor {
    public function redact(string $text, array ...$sets): string {
        foreach ($sets as $variables) foreach ($variables as $key=>$value) if (is_scalar($value) && strlen((string)$value)>=4) $text=str_replace((string)$value,'[REDACTED]',$text);
        return preg_replace('/(?i)(password|secret|token|api[_-]?key)(\s*[=:]\s*)[^\s]+/', '$1$2[REDACTED]', $text) ?? $text;
    }
}
