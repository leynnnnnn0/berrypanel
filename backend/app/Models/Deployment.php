<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Deployment extends Model {
    protected $guarded = [];
    protected function casts(): array { return ['enabled_services'=>'array','health_check_result'=>'array','started_at'=>'datetime','ended_at'=>'datetime']; }
    public function site(): BelongsTo { return $this->belongsTo(Site::class); }
    public function logs(): HasMany { return $this->hasMany(DeploymentLog::class); }
}
