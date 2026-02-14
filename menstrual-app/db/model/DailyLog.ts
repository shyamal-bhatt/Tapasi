import { Model } from '@nozbe/watermelondb'
import { date, field, json, readonly, text, writer } from '@nozbe/watermelondb/decorators'

// Helper to sanitize JSON parsing
const sanitizeJson = (raw: any) => {
    if (!raw) return [];
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return [];
    }
}

// Helper for Exercise object since it's nested
const sanitizeExercise = (raw: any) => {
    if (!raw) return { types: [], stepCount: undefined };
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
            types: Array.isArray(parsed.types) ? parsed.types : [],
            stepCount: typeof parsed.stepCount === 'number' ? parsed.stepCount : undefined
        };
    } catch {
        return { types: [], stepCount: undefined };
    }
}

export default class DailyLog extends Model {
    static table = 'daily_logs'

    @text('date') date!: string
    @text('bleeding_flow') bleedingFlow!: string | null
    @text('bleeding_color') bleedingColor!: string | null

    // JSON Fields - we use helper getters/setters or the @json decorator if available (but simplistic string access is safer for custom parsing)
    @text('moods_json') _moodsJson!: string | null
    @text('symptoms_json') _symptomsJson!: string | null
    @text('cravings_json') _cravingsJson!: string | null
    @text('exercise_json') _exerciseJson!: string | null

    @text('work_load') workLoad!: string | null
    @field('sleep_hours') sleepHours!: number | null
    @text('sleep_quality') sleepQuality!: string | null
    @field('weight') weight!: number | null

    @field('birth_control') birthControl!: boolean | null
    @field('smoke') smoke!: boolean | null
    @field('alcohol') alcohol!: boolean | null

    @readonly @date('created_at') createdAt!: number
    @readonly @date('updated_at') updatedAt!: number

    // Getters for JSON fields
    get moods() { return sanitizeJson(this._moodsJson) }
    get symptoms() { return sanitizeJson(this._symptomsJson) }
    get cravings() { return sanitizeJson(this._cravingsJson) }
    get exercise() { return sanitizeExercise(this._exerciseJson) }

    // Setters - we need to stringify
    set moods(value: string[]) { this._moodsJson = JSON.stringify(value) }
    set symptoms(value: string[]) { this._symptomsJson = JSON.stringify(value) }
    set cravings(value: string[]) { this._cravingsJson = JSON.stringify(value) }
    set exercise(value: any) { this._exerciseJson = JSON.stringify(value) }

    // Convenience getter for bleeding object
    get bleeding() {
        if (!this.bleedingFlow) return undefined;
        return {
            flow: this.bleedingFlow,
            color: this.bleedingColor
        };
    }

    // Convenience getter for sleep object
    get sleep() {
        if (!this.sleepHours && !this.sleepQuality) return undefined;
        return {
            hours: this.sleepHours || undefined,
            quality: this.sleepQuality || undefined
        };
    }

    @writer async updateLog(updates: any) {
        await this.update(log => {
            if (updates.bleeding) {
                log.bleedingFlow = updates.bleeding.flow ?? log.bleedingFlow;
                log.bleedingColor = updates.bleeding.color ?? log.bleedingColor;
            }
            if (updates.moods) log.moods = updates.moods;
            if (updates.symptoms) log.symptoms = updates.symptoms;
            if (updates.cravings) log.cravings = updates.cravings;
            if (updates.exercise) {
                // merge exercise
                const current = log.exercise;
                log.exercise = { ...current, ...updates.exercise };
            }
            if (updates.workLoad) log.workLoad = updates.workLoad;
            if (updates.sleep) {
                log.sleepHours = updates.sleep.hours ?? log.sleepHours;
                log.sleepQuality = updates.sleep.quality ?? log.sleepQuality;
            }
            if (updates.weight !== undefined) log.weight = updates.weight;
            if (updates.birthControl !== undefined) log.birthControl = updates.birthControl;
            if (updates.smoke !== undefined) log.smoke = updates.smoke;
            if (updates.alcohol !== undefined) log.alcohol = updates.alcohol;
        })
    }
}
