<template>
    <button class="collapsible">Ülesanne {{ nr }}</button>
    <div class="content">
        <p :id="'task' + nr">
            <span v-html="desc"></span>
            <span v-if="hint" class="tooltip">(Vihje)
                <span class="tooltiptext" v-html="hint"></span>
            </span>
        </p>
    </div>
</template>
<script>
export default {
    props: [
        'nr',
        'desc',
        'hint',
    ]
};
</script>
<style>
</style>