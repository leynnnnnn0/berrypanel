<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateHostingSettingsRequest extends FormRequest {
    public function authorize(): bool{return $this->user()?->can('update',$this->route('site'))??false;}
    public function rules(): array{return [
        'repository_url'=>['required','url','max:255','regex:/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/'], 'repository_branch'=>['required','string','max:120','regex:/^[A-Za-z0-9._\/-]+$/'],
        'backend_directory'=>['required','string','max:255','regex:/^\/(?!.*\.\.)(?:[A-Za-z0-9._-]+\/?)*$/'], 'frontend_directory'=>['required','string','max:255','regex:/^\/(?!.*\.\.)(?:[A-Za-z0-9._-]+\/?)*$/'], 'laravel_public_directory'=>['required','string','max:255','regex:/^\/(?!.*\.\.)(?:[A-Za-z0-9._-]+\/?)*$/'],
        'node_version'=>['required','in:18,20,22,24'], 'package_manager'=>['required','in:npm,yarn,pnpm'], 'node_install_command'=>['required','string','max:120'], 'node_build_command'=>['required','string','max:120'], 'node_start_command'=>['required','string','max:120'], 'php_version'=>['required','in:8.3,8.4'],
        'domain'=>['required','string','max:253','regex:/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/'], 'ssl_enabled'=>['boolean'], 'migrate_on_deploy'=>['boolean'], 'build_on_deploy'=>['boolean'], 'restart_services_on_deploy'=>['boolean'], 'health_check_url'=>['nullable','url','max:255'], 'deployment_timeout'=>['required','integer','between:60,3600']
    ];}
}
