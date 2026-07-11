<?php
namespace App\Services\Hosting;
use App\Models\Site; use App\Models\SiteEnvironment; use Illuminate\Support\Facades\File;
class EnvironmentManager {
    public function get(Site $site, string $scope): array { return SiteEnvironment::firstOrCreate(['site_id'=>$site->id,'scope'=>$scope],['variables'=>[]])->variables ?? []; }
    public function save(Site $site,string $scope,array $variables): SiteEnvironment {
        $paths=app(SitePathResolver::class); $directory=$paths->directory($site,$scope==='laravel'?$site->backend_directory:$site->frontend_directory);
        $content=collect($variables)->map(fn($v,$k)=>$k.'='.$this->format((string)$v))->implode(PHP_EOL).PHP_EOL;
        File::put($directory.'/.env',$content,true); @chmod($directory.'/.env',0600);
        return SiteEnvironment::updateOrCreate(['site_id'=>$site->id,'scope'=>$scope],['variables'=>$variables]);
    }
    public function parse(string $content): array { $out=[]; foreach(preg_split('/\R/',$content) as $line){$line=trim($line);if($line===''||str_starts_with($line,'#')||!str_contains($line,'='))continue;[$k,$v]=explode('=',$line,2);if(preg_match('/^[A-Z_][A-Z0-9_]*$/i',trim($k)))$out[trim($k)]=trim($v," \t\n\r\0\x0B\"'");} return $out; }
    private function format(string $v): string { return preg_match('/[\s#="\']/', $v)?'"'.addcslashes($v,"\\\"").'"':$v; }
}
