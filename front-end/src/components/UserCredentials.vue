<script>
</script>
<template>
    <div>
        <p id="name">
            Nimi:
            <strong>{{ this.$route.query.name }}</strong>
        </p>
        <p v-if="this.$route.query.name != 'külaline'" id="matriculation">
            Matrikkel:
            <strong>{{ this.$route.query.mat }}</strong>
        </p>
    </div>
</template>
<style scoped>
div {
    display: flex;
    position: absolute;
    top: 0
}

#name {
    display: flex;
}

#name>strong {
    margin: 0 10px 0 6px
}

strong {
    margin-left: 6px;
    font-weight: bold
}
</style>