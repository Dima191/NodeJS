class APIFeatures {
    constructor(query, queryString) {
        this.query = query; //Model
        this.queryString = queryString; //query from a route
    }

    filter() {
        const queryObj = {...this.queryString};
        const excludedFields = ['page', 'sort', 'limit', 'fields'];

        excludedFields.forEach(el => delete queryObj[el]);

        let queryString = JSON.stringify(queryObj);

        queryString = queryString.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);

        this.query = this.query.find(JSON.parse(queryString));
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.replaceAll(',', ' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
    }

    pagination() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;

        this.query = this.query.skip((page - 1) * limit).limit(limit);
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.replaceAll(',', ' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
    }
}

module.exports = APIFeatures;